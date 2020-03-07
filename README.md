# Rational Ray Casting

This is a modified version of the one detailed in: 
<b>[Raycasting Basics with JavaScript](https://courses.pikuma.com/courses/raycasting)</b><br>
By: <b>Gustavo Pezzi</b><br>
<br>
This work is meant to be a practical demonstration of how <i>transcendental</i> functions <u>can</u> be avoided completely<br>
 in a computer graphics rendering programs, while at the same time making the code simpler and faster.

This work is inspired by the work of professor <b>Norman J. Wildberger</b> of the <b>University of New South Wales</b><br>
In particular: <i>[WildTrig: Intro to Rational Trigonometry](https://www.youtube.com/watch?v=GGj399xIssQ&list=PL3C58498718451C47)</i><br>

This implementation does <u><b>not</b> make use of <i><b>any</b></i> angles or measures of distances(!)</u><br>
It intentionally avoids <u>any</u> <i>transcendental</i> functions such as:<b>
1. sin()
2. cos()
3. tan()
4. sqrt()</b>

It does <b>not</b> achieve that through traditional means such as substitution with tables or approximation.<br>
Instead, a purely rational approach is taken all throughout. <br>

This implementation relies heavily on the <i>[rational parameterization of the unit circle](https://mathnow.wordpress.com/2009/11/06/a-rational-parameterization-of-the-unit-circle)</i> 
to produce directional unit vectors.<br>
These are used to represent the player's orientation and the ray's directions,<br>
as well as for constructing 2D rotation matrices for re-orienting the player and the rays.<br>
<br>
In the original version 2 distances are computed for the horizontal and vertical hits.<br>
They were computed as <i>positive</i> distance measures and subsequently used for each ray to:
1. Determine which of the horizontal vs. vertical hits is the closest.
2. Compute the height of each pixel column in the 3D viewport.

To fix the perspective distortion (fish-eye lens effect) a trigonometric <b>cos()</b> function was used <br>
to convert the <i>original</i> distance of the closest hit point into a <i>perpendicular</i> distance. <br>
Since <b>this</b> implementation represents orientations as 2D unit-vectors instead of angles<br>
the same is achieved with a simple dot product -  <i>projecting</i> the ray's vector onto the player's orientation vector.

The 2 hit-distances were computed originally using the pythagorean theorem, involving a square root.<br>
They were then compared to determine which of the 2 hits is closest.<br>
In <b>this</b> implementation, since the only use left for them is a comparison <i>and</i> the numbers were are positive<br>
the squares of the distances are used for the comparison instead, thereby avoiding the square-root.<br>
This would not have been possible if the distances were needed to compute the <i>perpendicular distance</i><br>
since that non-linearity of the squaring would have resulted in distortion to the perspective.<br>
However since the <i>perpendicular distance</i> is computed here by other means,<br>
the computation of the distances themselves is avoided entirely.